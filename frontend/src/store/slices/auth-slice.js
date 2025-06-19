export const createAuthSlice = (set) => ({
    userInfo: undefined,
    setUserInfo: (update) =>
        set((state) => ({
            userInfo:
                typeof update === "function"
                    ? update(state.userInfo)
                    : { ...state.userInfo, ...update },
        })),
});