import type { Subject } from './types';

export interface User {
    username: string;
}

const USERS_KEY = 'trackademic_users';
const SESSION_KEY = 'trackademic_session';
const DATA_PREFIX = 'trackademic_data_';

const getUsers = (): any[] => {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
};

const saveUsers = (users: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const register = async (username: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !username || !password) return false;
    const users = getUsers();
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (existingUser) {
        return false; 
    }

    users.push({ username, password });
    saveUsers(users);
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    return true;
};

export const login = async (username: string, password: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
        return true;
    }

    return false;
};

export const logout = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = sessionStorage.getItem(SESSION_KEY);
    return user ? JSON.parse(user) : null;
};

export const getUserData = (username: string): Subject[] | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(`${DATA_PREFIX}${username}`);
    return data ? JSON.parse(data) : null;
}

export const saveUserData = (username: string, subjects: Subject[]) => {
    if (typeof window === 'undefined') return;
    const subjectsToStore = subjects.map(({ icon, ...rest }) => rest);
    localStorage.setItem(`${DATA_PREFIX}${username}`, JSON.stringify(subjectsToStore));
}
