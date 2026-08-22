import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDraggable } from "../useDraggable";
import { useWatermark } from "../useWatermark";

afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
});

describe("useDraggable", () => {
    it("启用、拖动、重置和关闭", () => {
        const target = document.createElement("div");
        const handle = document.createElement("button");
        document.body.append(target, handle);
        vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
            x: 10,
            y: 10,
            left: 10,
            top: 10,
            right: 110,
            bottom: 110,
            width: 100,
            height: 100,
            toJSON: () => ({}),
        });
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
            callback(0);
            return 1;
        });
        const { result } = renderHook(() => useDraggable(target, handle, { resize: false }));
        act(() => result.current.init());
        act(() => handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 20, clientY: 20 })));
        act(() => document.dispatchEvent(new MouseEvent("mousemove", { clientX: 40, clientY: 50 })));
        expect(result.current.dragging).toBe(true);
        expect(result.current.transform).toEqual({ offsetX: 20, offsetY: 30 });
        expect(target.style.transform).toBe("translate(20px, 30px)");
        act(() => document.dispatchEvent(new MouseEvent("mouseup")));
        expect(result.current.dragging).toBe(false);
        act(() => result.current.close());
        expect(result.current.draggable).toBe(false);
        act(() => result.current.reset());
        expect(result.current.transform).toEqual({ offsetX: 0, offsetY: 0 });
    });
});

describe("useWatermark", () => {
    it("创建、更新和清理水印", async () => {
        const context = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            fillText: vi.fn(),
            createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
            drawImage: vi.fn(),
            fillStyle: "",
            font: "",
            textAlign: "left",
            textBaseline: "middle",
            globalAlpha: 1,
            shadowBlur: 0,
            shadowColor: "",
            shadowOffsetX: 0,
            shadowOffsetY: 0,
        };
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
        vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,test");
        const host = document.createElement("div");
        Object.defineProperties(host, {
            clientWidth: { value: 300 },
            clientHeight: { value: 200 },
        });
        document.body.appendChild(host);
        const { result } = renderHook(() => useWatermark(host));
        let id: string | undefined;
        await act(async () => {
            id = await result.current.setWatermark("测试");
        });
        expect(id).toBeDefined();
        expect(host.querySelector(`#${id}`)).not.toBeNull();
        act(() => result.current.clear());
        expect(host.querySelector(`#${id}`)).toBeNull();
    });
});
