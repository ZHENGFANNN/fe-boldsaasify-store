// 第三方包 CSS side-effect 导入的类型声明。
// @splidejs/splide 未为其 CSS 子路径提供 .d.ts，.tsx 文件 import "@splidejs/splide/css"
// 会在 tsc 类型检查阶段报 "Cannot find module ... side-effect import"（.js 不检查故无此问题）。
declare module "@splidejs/splide/css";
declare module "@splidejs/splide/css/*";
