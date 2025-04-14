// Possible file location: app/(dashboard)/accounts/page.tsx
// Or: app/(whatever_group)/account/page.tsx

import Chatbot from '@/components/Chatbot'; // Make sure the import path is correct

// Define the AccountsPage component
const AccountsPage = () => {
    return (
        <div>
            <h1>Your Account</h1> {/* Added a heading */}
            {/* Other account-specific content like profile settings, etc. */}
            <p>Manage your profile and settings here.</p>

            {/* --- Add the Chatbot section --- */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h2>Chat Assistant</h2>
                <Chatbot /> {/* Render the Chatbot component */}
            </div>
            {/* --- End Chatbot section --- */}

        </div>
    );
}

// Export the AccountsPage component as the default for this page route
export default AccountsPage;