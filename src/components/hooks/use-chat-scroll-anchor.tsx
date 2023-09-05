"use client";

import { Message } from "ai";
import { RefObject, useEffect, useState } from "react";

export const useChatScrollAnchor = (
    chats: Message[],
    ref: RefObject<HTMLDivElement>
) => {
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = ref.current;
      const atBottom = (scrollHeight - scrollTop) === clientHeight;
      setAutoScroll(atBottom);
    }

    if (ref.current) {
      ref.current.addEventListener('scroll', handleScroll);

      if (autoScroll) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [chats, ref, autoScroll]);
};
