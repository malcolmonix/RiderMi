import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatOverlay({ rideId, currentUserId, otherUserName, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Listen for messages
    useEffect(() => {
        if (!rideId) return;

        const messagesRef = collection(db, 'rides', rideId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            scrollToBottom();
        }, (error) => {
            console.error('Chat snapshot error:', error);
        });

        return () => unsubscribe();
    }, [rideId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'rides', rideId, 'messages'), {
                text: newMessage,
                senderId: currentUserId,
                createdAt: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-black text-white p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Chat with {otherUserName}</h3>
                        <p className="text-xs text-gray-400">Ride #{rideId?.slice(-6)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-500 mt-10">No messages yet. Say hello! 👋</p>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-black text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-black text-white p-3 rounded-xl disabled:opacity-50 hover:bg-gray-900 transition-colors"
                        >
                            ➤
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
