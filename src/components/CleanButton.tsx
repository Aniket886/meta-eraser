import { Sparkles } from "lucide-react";

interface CleanButtonProps {
  onClick: () => void;
  label?: string;
  activeLabel?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

const CleanButton = ({
  onClick,
  label = "Clean",
  activeLabel = "Cleaning",
  disabled = false,
  size = "md",
}: CleanButtonProps) => {
  const letters = label.split("");
  const activeLetters = activeLabel.split("");

  return (
    <div className="clean-btn-wrapper">
      <button
        className={`clean-btn ${size === "sm" ? "clean-btn-sm" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        <Sparkles className="clean-btn-svg" />
        <span className="clean-btn-txt-wrapper">
          <span className="clean-btn-txt-1" style={{ whiteSpace: "nowrap" }}>
            {letters.map((letter, i) => (
              <span
                key={`l1-${i}`}
                className="clean-btn-letter"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </span>
          <span className="clean-btn-txt-2" style={{ whiteSpace: "nowrap" }}>
            {activeLetters.map((letter, i) => (
              <span
                key={`l2-${i}`}
                className="clean-btn-letter"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </span>
        </span>
      </button>
    </div>
  );
};

export default CleanButton;
