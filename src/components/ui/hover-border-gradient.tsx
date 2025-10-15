"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    containerClassName?: string;
    className?: string;
    as?: React.ElementType;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex + 1) % 4
      : (currentIndex - 1 + 4) % 4;
    return directions[nextIndex];
  };

  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
    LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
    BOTTOM:
      "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
    RIGHT:
      "radial-gradient(16.2% 41.199999999999996% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  };

  const highlight =
    "radial-gradient(75% 181.15942028985506% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

  useEffect(() => {
    if (hovered) {
      intervalRef.current = setInterval(() => {
        setDirection((prev) => rotateDirection(prev));
      }, duration * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hovered, duration, clockwise]);

  return (
    <Tag
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      className={cn(
        "relative flex h-min w-fit flex-row items-center justify-center overflow-hidden rounded-full border border-black/[0.2] bg-transparent p-[2px] transition-all duration-300 ease-in-out hover:shadow-2xl dark:border-white/[0.2]",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "relative z-10 h-full w-full rounded-full px-4 py-2 text-sm text-black dark:text-white",
          className
        )}
      >
        {children}
      </div>
      {hovered && (
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            filter: "blur(2px)",
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          initial={{ background: movingMap[direction] }}
          animate={{
            background: hovered
              ? [movingMap[direction], highlight]
              : movingMap[direction],
          }}
          transition={{ ease: "linear", duration: duration ?? 1 }}
        />
      )}
    </Tag>
  );
}