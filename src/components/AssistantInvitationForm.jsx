import { useState } from 'react';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';

const AssistantInvitationForm = ({ supplierId, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSending(true);
    try {
      const res = await axiosInstance.post(
        `/login/suppliers/${supplierId}/invite-assistant`,
        { email }
      );
      
      toast.success(`Invitation sent to ${email}`);
      if (onInviteSent) onInviteSent(res.data.registrationLink);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Invite New Assistant</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Assistant Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="assistant@example.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isSending ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  );
};

export default AssistantInvitationForm;