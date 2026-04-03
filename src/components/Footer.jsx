import { FiCode, FiHeart, FiCpu } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className="cv-footer" data-theme={theme}>
      <div className="cv-footer__inner">
        <div className="cv-footer__left">
          <FiCpu size={13} />
          <span>Compiler Visualizer</span>
          <span style={{ margin: "0 4px", opacity: 0.4 }}>—</span>
          <span>Built with</span>
          <FiCode size={12} style={{ margin: "0 2px", color: "var(--accent)" }} />
          <span>&amp;</span>
          <FiHeart size={12} style={{ margin: "0 2px", color: "var(--red)" }} />
          <span>for CS students &amp; developers</span>
        </div>

        <div className="cv-footer__right">
          &copy; {new Date().getFullYear()} &nbsp;·&nbsp; All 6 compiler phases
        </div>
      </div>
    </footer>
  );
};

export default Footer;
