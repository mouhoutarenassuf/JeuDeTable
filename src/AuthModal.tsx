import React, { useState } from 'react';
import { supabase } from './supabase';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Veuillez remplir l'e-mail et le mot de passe !");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Erreur d'inscription : " + error.message);
    } else {
      alert("Inscription réussie ! Vérifie tes e-mails pour confirmer ton compte.");
      onClose();
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      alert("Veuillez remplir l'e-mail et le mot de passe !");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Erreur de connexion : " + error.message);
    } else {
      alert("Connexion réussie !");
      onClose();
    }
  };

  return (
    <div className="auth-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="auth-modal-content" style={{
        backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '350px', color: '#fff', position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
        >
          ✕
        </button>
        
        <h2 style={{ marginBottom: '20px' }}>Mon Compte</h2>
        
        <input
          type="email"
          placeholder="Ton e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff' }}
        />

        <input
          type="password"
          placeholder="Ton mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSignIn}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#f3e5ab', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Se connecter
          </button>
          <button 
            onClick={handleSignUp}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #f3e5ab', backgroundColor: 'transparent', color: '#f3e5ab', fontWeight: 'bold', cursor: 'pointer' }}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}
