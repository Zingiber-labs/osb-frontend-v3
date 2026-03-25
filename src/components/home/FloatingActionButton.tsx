const FloatingActionButton = ({
  icon,
  onClick,
  className = "",
  ariaLabel,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group flex h-[58px] w-[58px] items-center justify-center rounded-full
        border border-[#ff7a2f] bg-[#FF6B2F] shadow-[0_0_0_3px_rgba(255,107,47,0.25),0_0_18px_rgba(0,255,255,0.18)]
        transition duration-200 hover:scale-105 hover:bg-[#ff7f3f] ${className}`}
    >
      <div
        className="flex h-[44px] w-[44px] items-center justify-center rounded-full
        border border-[#7cf8ff]/60 bg-[#A63F17]"
      >
        {icon}
      </div>
    </button>
  );
};

export default FloatingActionButton;
