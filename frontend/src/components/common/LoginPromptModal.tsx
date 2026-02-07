import React from 'react';
import { Link } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <LogIn size={28} className="text-orange-500" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Login Required
        </h3>
        <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
          You need to log in first to book services. Please sign in to your account or create a new one to continue.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20 hover:shadow-md"
          >
            <LogIn size={18} />
            Sign In
          </Link>
          <Link
            to="/auth/role-selection"
            className="flex items-center justify-center gap-2 w-full bg-white border-2 border-gray-200 hover:border-orange-400 text-gray-700 hover:text-orange-500 font-semibold py-3.5 rounded-xl transition-all"
          >
            <UserPlus size={18} />
            Create Account
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center mt-5">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default LoginPromptModal;
