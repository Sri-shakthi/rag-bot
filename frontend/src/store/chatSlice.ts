import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  Message,
  sendAiMessage,
  fetchCases,
  fetchCaseById,
  fetchSessions,
  createSession,
  uploadDocument,
  fetchUploadedDocuments,
  LegalCase,
  BackendSession,
  UploadedDocument
} from '../services/api';
import type { RootState } from './index';

export interface ChatSession {
  id: string;
  caseId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  uploadedDocuments?: UploadedDocument[];
  activeDocumentId?: string | null;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  selectedCaseId: string | null;
  cases: LegalCase[];
  selectedCaseContent: string;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  selectedCaseId: null,
  cases: [],
  selectedCaseContent: '',
  isLoading: false,
  isBootstrapping: false,
  error: null
};

function deriveTitle(content: string): string {
  const compact = content.trim().replace(/\s+/g, ' ');
  if (!compact) return 'New chat';
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
}

function toUiSession(item: BackendSession): ChatSession {
  const createdAt = Date.parse(item.createdAt) || Date.now();
  const updatedAt = Date.parse(item.updatedAt) || createdAt;
  const messages: Message[] = (item.messages || []).map((m, idx) => ({
    id: `${item.sessionId}-${idx}`,
    role: m.role,
    content: m.content,
    timestamp: updatedAt + idx
  }));

  const firstUserMessage = messages.find((m) => m.role === 'user');
  return {
    id: item.sessionId,
    caseId: item.caseId,
    title: firstUserMessage ? deriveTitle(firstUserMessage.content) : 'New chat',
    messages,
    createdAt,
    updatedAt
  };
}

function buildSessionId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}`;
}

export const bootstrapChatData = createAsyncThunk<
  {
    cases: LegalCase[];
    selectedCaseId: string | null;
    selectedCaseContent: string;
    sessions: ChatSession[];
  },
  void,
  { rejectValue: string }
>('chat/bootstrapChatData', async (_, { rejectWithValue }) => {
  try {
    const casesRes = await fetchCases();
    const cases = casesRes.cases || [];
    if (!cases.length) {
      return {
        cases: [],
        selectedCaseId: null,
        selectedCaseContent: '',
        sessions: []
      };
    }

    const allSessionsRes = await fetchSessions();
    const latestSession = (allSessionsRes.sessions || [])[0] || null;
    const latestCaseId = latestSession?.caseId || null;
    const selectedCaseId =
      latestCaseId && cases.some((item) => item.id === latestCaseId)
        ? latestCaseId
        : cases[0].id;
    const [caseRes, sessionsRes] = await Promise.all([
      fetchCaseById(selectedCaseId),
      fetchSessions(selectedCaseId)
    ]);
    let sessions = (sessionsRes.sessions || []).map(toUiSession);
    if (!sessions.length) {
      const created = await createSession(buildSessionId(), selectedCaseId);
      sessions = [toUiSession(created.session)];
    }

    return {
      cases,
      selectedCaseId,
      selectedCaseContent: caseRes.case.content || '',
      sessions
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load data');
  }
});

export const switchCase = createAsyncThunk<
  {
    selectedCaseId: string;
    selectedCaseContent: string;
    sessions: ChatSession[];
  },
  string,
  { rejectValue: string }
>('chat/switchCase', async (caseId, { rejectWithValue }) => {
  try {
    const [caseRes, sessionsRes] = await Promise.all([
      fetchCaseById(caseId),
      fetchSessions(caseId)
    ]);
    let sessions = (sessionsRes.sessions || []).map(toUiSession);
    if (!sessions.length) {
      const created = await createSession(buildSessionId(), caseId);
      sessions = [toUiSession(created.session)];
    }

    return {
      selectedCaseId: caseId,
      selectedCaseContent: caseRes.case.content || '',
      sessions
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to switch case');
  }
});

export const sendMessage = createAsyncThunk<
  { sessionId: string; message: Message },
  string,
  { state: RootState; rejectValue: string }
>(
  'chat/sendMessage',
  async (content: string, { dispatch, getState, rejectWithValue }) => {
    const state = getState().chat;
    const sessionId = state.activeSessionId;
    const session = state.sessions.find((item) => item.id === sessionId);
    const caseId = state.selectedCaseId;

    if (!sessionId || !session || !caseId) {
      return rejectWithValue('Please select a case and session first');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    dispatch(addMessage({ sessionId, message: userMsg }));

    try {
      const history = session.messages
        .slice(-10)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 3500) }));

      const response = await sendAiMessage(
        sessionId,
        caseId,
        content,
        history,
        session.activeDocumentId || undefined
      );
      return {
        sessionId,
        message: {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.reply,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  }
);

export const uploadFile = createAsyncThunk<
  { sessionId: string; message: Message; documentId: string; fileName: string },
  File,
  { state: RootState; rejectValue: string }
>(
  'chat/uploadFile',
  async (file: File, { dispatch, getState, rejectWithValue }) => {
    const state = getState().chat;
    const sessionId = state.activeSessionId;
    const caseId = state.selectedCaseId;
    if (!sessionId || !caseId) return rejectWithValue('No active chat session found');

    dispatch(addMessage({
      sessionId,
      message: {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded file: ${file.name}`,
        timestamp: Date.now()
      }
    }));

    try {
      const result = await uploadDocument(sessionId, caseId, file);
      return {
        sessionId,
        documentId: result.documentId,
        fileName: result.fileName,
        message: {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            `Uploaded "${result.fileName}" and indexed ${result.chunks} chunks. ` +
            `Your next questions will be answered from this uploaded document.`,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Upload failed');
    }
  }
);

export const hydrateSessionDocuments = createAsyncThunk<
  { sessionId: string; documents: UploadedDocument[] },
  string,
  { rejectValue: string }
>('chat/hydrateSessionDocuments', async (sessionId, { rejectWithValue }) => {
  try {
    const result = await fetchUploadedDocuments(sessionId);
    return {
      sessionId,
      documents: result.documents || []
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load uploaded documents');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<string>) => {
      const exists = state.sessions.some((item) => item.id === action.payload);
      if (exists) {
        state.activeSessionId = action.payload;
        state.error = null;
      }
    },
    setActiveDocumentForSession: (
      state,
      action: PayloadAction<{ sessionId: string; documentId: string | null }>
    ) => {
      const session = state.sessions.find((item) => item.id === action.payload.sessionId);
      if (!session) return;
      session.activeDocumentId = action.payload.documentId;
    },
    addMessage: (
      state,
      action: PayloadAction<{ sessionId: string; message: Message }>
    ) => {
      const session = state.sessions.find((item) => item.id === action.payload.sessionId);
      if (!session) return;

      if (!session.messages.some((msg) => msg.id === action.payload.message.id)) {
        session.messages.push(action.payload.message);
        session.updatedAt = Date.now();
      }

      if (
        action.payload.message.role === 'user' &&
        session.title === 'New chat'
      ) {
        session.title = deriveTitle(action.payload.message.content);
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapChatData.pending, (state) => {
        state.isBootstrapping = true;
        state.error = null;
      })
      .addCase(bootstrapChatData.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        state.cases = action.payload.cases;
        state.selectedCaseId = action.payload.selectedCaseId;
        state.selectedCaseContent = action.payload.selectedCaseContent;
        state.sessions = action.payload.sessions;
        state.activeSessionId = action.payload.sessions[0]?.id || null;
      })
      .addCase(bootstrapChatData.rejected, (state, action) => {
        state.isBootstrapping = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to bootstrap chat';
      })
      .addCase(switchCase.pending, (state) => {
        state.isBootstrapping = true;
        state.error = null;
      })
      .addCase(switchCase.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        state.selectedCaseId = action.payload.selectedCaseId;
        state.selectedCaseContent = action.payload.selectedCaseContent;
        state.sessions = action.payload.sessions;
        state.activeSessionId = action.payload.sessions[0]?.id || null;
      })
      .addCase(switchCase.rejected, (state, action) => {
        state.isBootstrapping = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to switch case';
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const session = state.sessions.find((item) => item.id === action.payload.sessionId);
        if (!session) return;
        session.messages.push(action.payload.message);
        session.updatedAt = Date.now();
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to send message';
      })
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false;
        const session = state.sessions.find((item) => item.id === action.payload.sessionId);
        if (!session) return;
        session.activeDocumentId = action.payload.documentId;
        if (!Array.isArray(session.uploadedDocuments)) {
        session.uploadedDocuments = [];
        }
        session.uploadedDocuments.unshift({
          id: action.payload.documentId,
          sessionId: action.payload.sessionId,
          fileName: action.payload.fileName,
          createdAt: new Date().toISOString()
        });
        session.messages.push(action.payload.message);
        session.updatedAt = Date.now();
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to upload file';
      })
      .addCase(hydrateSessionDocuments.fulfilled, (state, action) => {
        const session = state.sessions.find((item) => item.id === action.payload.sessionId);
        if (!session) return;
        session.uploadedDocuments = action.payload.documents;
        if (!session.activeDocumentId && action.payload.documents.length) {
          session.activeDocumentId = action.payload.documents[0].id;
        }
      });
  }
});

export const {
  setActiveSession,
  setActiveDocumentForSession,
  addMessage,
  setError
} = chatSlice.actions;

export default chatSlice.reducer;
