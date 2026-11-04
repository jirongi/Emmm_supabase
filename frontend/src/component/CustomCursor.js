import { useEffect, useRef } from "react";
import style from "../CSS/CustomCursor.module.css";

// 누를 수 있는 것 위에서는 링이 커진다
const INTERACTIVE = [
  "button", "a", "label[for]", "select", "img", "[role=button]",
  '[class^="Home_new__"]', '[class^="Progress_room__"]', '[class^="Progress_archive__"]', '[class^="Archive_room__"]',
  '[class^="Right_Block__"]', '[class^="Right_BigBlock__"]',
  '[class^="Left_Block__"]', '[class^="Left_ChosenBlock__"]', '[class^="Left_Add__"]',
  '[class^="Header_Number__"]', '[class^="Header_StateIng__"]', '[class^="Header_StateFinish__"]',
  '[class^="DM_DMdiv__"]', '[class^="File_box__"]', '[class^="File_Createbox__"]',
  '[class^="File_Nofilediv__"]', '[class^="AI_NoAIdiv__"]', '[class^="Vote_Novotediv__"]',
  '[class^="Vote_Vote__"]', '[class^="Vote_detail_modal_Vote__"]', '[class^="Vote_detail_modal_ChosenVote__"]',
  '[class*="Maintitle"] h2', '[class^="DM_Top__"] p',
].join(",");
const TEXT = "input:not([type=file]), textarea, [contenteditable=true]";

// 마우스를 따라다니는 점 + 살짝 늦게 따라오는 링. 터치 기기에서는 쓰지 않는다.
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");

    const dot = dotRef.current;
    const ring = ringRef.current;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let frame;

    const loop = () => {
      // 링은 목표 지점으로 조금씩 다가간다 (부드럽게 따라오는 느낌)
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      root.classList.add("custom-cursor-visible");
      const el = e.target instanceof Element ? e.target : null;
      const text = el?.closest(TEXT);
      ring.dataset.state = text ? "text" : el?.closest(INTERACTIVE) ? "hover" : "";
    };
    const onDown = () => ring.classList.add(style.Pressed);
    const onUp = () => ring.classList.remove(style.Pressed);
    // 창 밖이나 PDF 미리보기(iframe)로 나가면 숨긴다 (거기서는 기본 커서가 보임)
    const onOut = (e) => {
      if (!e.relatedTarget || e.relatedTarget.tagName === "IFRAME") root.classList.remove("custom-cursor-visible");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseout", onOut);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("custom-cursor", "custom-cursor-visible");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className={style.Ring} aria-hidden="true"><span /></div>
      <div ref={dotRef} className={style.Dot} aria-hidden="true"><span /></div>
    </>
  );
}

export default CustomCursor;
