import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useECharts } from "../useECharts";

describe("useECharts", () => {
    it("初始化实例并代理常用方法", () => {
        const instance = {
            setOption: vi.fn(),
            clear: vi.fn(),
            resize: vi.fn(),
            dispose: vi.fn(),
            showLoading: vi.fn(),
            hideLoading: vi.fn(),
            appendData: vi.fn(),
            getWidth: vi.fn(() => 300),
            getHeight: vi.fn(() => 200),
            getDom: vi.fn(() => document.createElement("canvas")),
            getOption: vi.fn(() => ({ series: [] })),
            getDataURL: vi.fn(() => "data:image/png"),
            getConnectedDataURL: vi.fn(() => "data:image/png"),
            on: vi.fn(),
            off: vi.fn(),
            getZr: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
        };
        const echarts = { init: vi.fn(() => instance) };
        const element = document.createElement("div");
        const { result, unmount } = renderHook(() => useECharts(element, { echarts }));
        act(() => result.current.setOptions({ series: [] }));
        expect(echarts.init).toHaveBeenCalledWith(element, "default", expect.any(Object));
        expect(instance.setOption).toHaveBeenCalledWith({ series: [] });
        expect(result.current.getWidth()).toBe(300);
        act(() => result.current.resize());
        expect(instance.resize).toHaveBeenCalled();
        unmount();
        expect(instance.dispose).toHaveBeenCalled();
    });
});
