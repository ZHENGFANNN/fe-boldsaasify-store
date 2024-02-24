"use client";
// 图片封面懒加载
export const lazyLoadImages = function ($container) {
  if (!$container) return;

  const viewportHeight = $(window).height();
  const images = $container.find("img[data-src]");

  function lazyLoad() {
    const scrollTop = $(window).scrollTop();

    images.each(function () {
      const $img = $(this);
      const imgTop = $img.offset()?.top;

      if (viewportHeight * 2 + scrollTop > imgTop) {
        $img.attr("src", $img.attr("data-src"));
        $img.removeAttr("data-src");
      }
    });

    // Remove scroll event listener if all images loaded
    if (images.length === 0) {
      $(window).off("scroll", lazyLoad);
    }
  }

  // Bind scroll event listener
  lazyLoad();
  $(window).on("scroll", lazyLoad);

  // Return function to remove scroll event listener
  return () => $(window).off("scroll", lazyLoad);
};

// 视频封面懒加载
export const lazyLoadVideos = function ($container) {
  if (!$container) return;

  const viewportHeight = $(window).height();
  const videos = $container.find("video[data-poster]");

  function lazyLoad() {
    const scrollTop = $(window).scrollTop();

    videos.each(function () {
      const $video = $(this);
      const videoTop = $video.offset()?.top;

      if (viewportHeight * 2 + scrollTop > videoTop) {
        $video.attr("poster", $video.attr("data-poster"));
        $video.removeAttr("data-poster");
      }
    });

    // Remove scroll event listener if all videos loaded
    if (videos.length === 0) {
      $(window).off("scroll", lazyLoad);
    }
  }

  // Bind scroll event listener
  $(window).on("scroll", lazyLoad);

  // Return function to remove scroll event listener
  return () => $(window).off("scroll", lazyLoad);
};

// 首屏脚本优化
export function ifScrollDown({ onToggle }) {
  function handler() {
    if ($(window).scrollTop() > 0) {
      onToggle();
      $(window).off("scroll", handler);
    }
  }
  $(window).on("scroll", handler);
}
