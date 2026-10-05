import React from "react";
import { ClipLoader } from "react-spinners";

export const GlobalLoading = ({
  fullScreen = false,
}: {
  fullScreen?: boolean;
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-transparent select-none ${
        fullScreen
          ? "h-screen w-screen bg-agm-bg"
          : "min-h-[50vh] h-full w-full p-6"
      }`}
    >
      <ClipLoader color="#28633a" size={40} speedMultiplier={0.8} />
    </div>
  );
};
