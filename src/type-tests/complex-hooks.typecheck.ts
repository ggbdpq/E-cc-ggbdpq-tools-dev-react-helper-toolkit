import { useECharts, type EChartsAdapter, type EChartsOption } from "../echarts/useECharts";
import { useDraggable, type DraggableOptions } from "../hooks/useDraggable";
import { useWatermark, type WatermarkOptions } from "../hooks/useWatermark";

const draggable = { resize: 60, dragRefStyle: { cursor: "move" } } satisfies DraggableOptions;
useDraggable(document.body, document.body, draggable);
const watermark = { rotate: -10, color: "rgba(0,0,0,.2)" } satisfies WatermarkOptions;
useWatermark(document.body).setWatermark("text", watermark);
const adapter: EChartsAdapter = { init: () => ({}) as never };
const option = { series: [] } satisfies EChartsOption;
useECharts(document.body, { echarts: adapter }).setOptions(option);

// @ts-expect-error resize 只接受 boolean 或 number。
useDraggable(document.body, document.body, { resize: "60" });
