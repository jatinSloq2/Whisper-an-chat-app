import { apiClient } from "@/lib/api-client";
import { GET_USER_INFO } from "@/utils/constant";

export const createAuthSlice = (set) => ({
    userInfo: undefined,
    setUserInfo: (update) =>
        set((state) => ({
            userInfo:
                typeof update === "function"
                    ? update(state.userInfo)
                    : { ...state.userInfo, ...update },
        })),
    fetchUserInfo: async () => {
        try {
            const res = await apiClient.get(GET_USER_INFO);
            if (res.status === 200 && res.data.user) {
                set({ userInfo: res.data.user });
            } else {
                set({ userInfo: undefined });
            }
        } catch (error) {
            console.error("Failed to fetch user info:", error);
            set({ userInfo: undefined });
        }
    },
    // updateUserSettings: async (settings) => {
    //     try {
    //         const res = await apiClient.patch("/user/settings", settings);
    //         set({ userInfo: res.data }); // update local store
    //     } catch (err) {
    //         console.error("Error updating settings", err);
    //     }
    // },
});