import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import type { AuthState, User, RegisterPayload, LoginPayload } from '../types';
import { authAPI } from '../services/api';
import Loader from '../components/common/Loader';

// ─── Context Types ────────────────────────────────────────────────────────────
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// ─── Action Types ─────────────────────────────────────────────────────────────
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' };

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const res = await authAPI.getMe();
        if (res.data.success && res.data.data?.user) {
          dispatch({
            type: 'SET_USER',
            payload: { user: res.data.data.user, token },
          });
        } else {
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    };

    restoreSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token, data } = res.data;

    if (!token || !data?.user) throw new Error('Invalid server response');

    localStorage.setItem('token', token);
    dispatch({ type: 'SET_USER', payload: { user: data.user, token } });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authAPI.register(payload);
    const { token, data } = res.data;

    if (!token || !data?.user) throw new Error('Invalid server response');

    localStorage.setItem('token', token);
    dispatch({ type: 'SET_USER', payload: { user: data.user, token } });
  }, []);

  const logout = useCallback(() => {
    handleLogout();
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="lg" text="Initializing Smart Gov Platform..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
