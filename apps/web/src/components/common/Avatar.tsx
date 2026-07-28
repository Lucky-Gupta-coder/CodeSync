export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar = ({ name, size = "md", className = "" }: AvatarProps) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : "?";

  const sizes = {
    sm: "w-6 h-6 text-xs font-semibold",
    md: "w-8 h-8 text-sm font-bold",
    lg: "w-12 h-12 text-lg font-extrabold",
  };

  return (
    <div
      className={`rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 select-none shrink-0 ${sizes[size]} ${className}`}
    >
      {firstLetter}
    </div>
  );
};
