import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface UserData {
    id: string;
    email: string;
    name?: string;
    department?: string;
    avatar?: string;
    [key: string]: any;
}

interface AuthContextType {
    currentUser: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    logout: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Auto-assign SUPER ADMIN ROLE exclusively for the owner
                        if (user.email === 'nguyenviet212007@gmail.com') {
                            if (userData.department !== 'ADMIN' || userData.role !== 'ADMIN') {
                                try {
                                    await updateDoc(doc(db, 'users', user.uid), { department: 'ADMIN', role: 'ADMIN' });
                                    await updateDoc(doc(db, 'employees', user.uid), { department: 'ADMIN', role: 'ADMIN' });
                                    userData.department = 'ADMIN';
                                    userData.role = 'ADMIN';
                                } catch (e) {
                                    console.error("Auto-assign ADMIN failed", e);
                                }
                            }
                        }

                        setCurrentUser({ id: user.uid, email: user.email || '', ...userData });
                    } else {
                        setCurrentUser({ id: user.uid, email: user.email || '' });
                    }
                } catch (error) {
                    console.error("Lỗi khi tải thông tin user từ Firestore:", error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    // Vừa bật app, màn hình xoay spinner chờ giải mã Auth từ Firebase thay vì chớp nháy
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #ff7d0d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ currentUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
