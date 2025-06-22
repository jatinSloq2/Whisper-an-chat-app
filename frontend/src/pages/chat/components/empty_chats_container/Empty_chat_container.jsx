import { animationDefaultOptions } from "@/lib/utils";
import React from "react";
import Lottie from "react-lottie";

const Empty_chat_container = () => {
  return (
    <div className="flex-1 bg-gray-100 md:flex flex-col justify-center items-center hidden duration-1000 transition-all">
      <Lottie
        isClickToPauseDisabled={true}
        height={200}
        width={200}
        options={animationDefaultOptions}
      />
      <div className="flex flex-col gap-4 items-center mt-10 text-center transition-all duration-300">
        <h3 className="text-3xl lg:text-4xl font-semibold text-gray-800">
          Hi <span className="text-purple-500">!</span> Welcome to{" "}
          <span className="text-purple-600 font-bold">Whisper</span>
        </h3>
        <p className="text-sm text-gray-600 max-w-md">
          Start a new conversation by selecting a contact or create a new chat.
        </p>
      </div>
    </div>
  );
};

export default Empty_chat_container;
