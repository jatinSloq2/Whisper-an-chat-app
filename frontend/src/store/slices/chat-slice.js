export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    directMessagesContact: [],
    setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
    setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
    setSelectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
    setDirectMessagesContact: (directMessagesContact) =>
        set((state) => {
            const isSame = JSON.stringify(state.directMessagesContact) === JSON.stringify(directMessagesContact);
            if (isSame) return {}; 
            return { directMessagesContact };
        }),
    closeChat: () => set({
        selectedChatData: undefined,
        selectedChatType: undefined,
        selectedChatMessages: [],
    }),
    addMessage: (message) => {
        const selectedChatMessages = get().selectedChatMessages;
        const selectedChatType = get().selectedChatType;

        set({
            selectedChatMessages: [
                ...selectedChatMessages,
                {
                    ...message,
                    recipient:
                        selectedChatType === "channel"
                            ? message.recipient
                            : message.recipient._id,
                    sender:
                        selectedChatType === "channel"
                            ? message.sender
                            : message.sender._id,
                },
            ],
        });
    }
});