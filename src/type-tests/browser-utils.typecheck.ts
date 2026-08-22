import { banMouseEvent, type MouseEventName } from "../browser/banMouseEvent";
import { dataURLtoBlob, urlToBase64 } from "../browser/base64Conver";
import { addClass } from "../browser/class";
import { getBrowserInfo, type BrowserInfo } from "../browser/device";
import { downloadByData } from "../browser/download";
import { getPerformance, type PerformanceMetrics } from "../browser/performance";
import { storageLocal, type StorageProxy } from "../browser/storage";
import { getSvgInfo, type SvgInfo } from "../browser/svg";

const events = ["contextmenu", "copy"] satisfies MouseEventName[];
banMouseEvent(events);
dataURLtoBlob("data:text/plain;base64,dGVzdA==");
urlToBase64("https://example.com/image.png");
addClass(document.body, "active");
downloadByData("value", "file.txt");
const browser: BrowserInfo = getBrowserInfo();
const storage: StorageProxy = storageLocal();
const metrics: Promise<PerformanceMetrics> = getPerformance();
const svg: SvgInfo = getSvgInfo("<svg />");
void browser;
void storage;
void metrics;
void svg;

// @ts-expect-error 未知事件名不在兼容列表中。
banMouseEvent(["unknown"]);
