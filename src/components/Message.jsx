import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function Message({ msg }) {
  const processedText = msg.text
    // convert \( ... \) → $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`)
    // convert \[ ... \] → $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
    // convert [ ... ] → $...$ (optional, if old format still appears)
    .replace(/\[\s*([\s\S]*?)\s*\]/g, (_, m) => `$${m}$`);

  return (
    <div className="message-content">
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {processedText}
    </ReactMarkdown>
    </div>
  );
}

export default Message;
