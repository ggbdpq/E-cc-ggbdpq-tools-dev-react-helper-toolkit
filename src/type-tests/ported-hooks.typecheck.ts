import { createRef } from "react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { useDark, type UseDarkOptions } from "../hooks/useDark";
import { useLoader, type LoadResourceOptions } from "../hooks/useLoader";
import { useResizeObserver, type UseResizeObserverOptions } from "../hooks/useResizeObserver";
import { useScrollTo, type ScrollOptions } from "../hooks/useScrollTo";

useCopyToClipboard("");
const darkOptions = { selector: "html", className: "dark" } satisfies UseDarkOptions;
useDark(darkOptions);
const resource = { src: ["/a.js", "/b.js"], element: "body" } satisfies LoadResourceOptions;
useLoader().loadScript(resource);
const resizeOptions = { time: 40, box: "border-box", immediate: true } satisfies UseResizeObserverOptions;
useResizeObserver(createRef<HTMLDivElement>(), () => undefined, resizeOptions);
const scrollOptions = {
    el: createRef<HTMLDivElement>(),
    to: 100,
    directions: "scrollTop",
    duration: 300,
} satisfies ScrollOptions;
useScrollTo(scrollOptions);

// @ts-expect-error selector 只允许 html 或 body。
useDark({ selector: "main" });
