"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  src,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [hasTriedProxy, setHasTriedProxy] = React.useState(false);

  React.useEffect(() => {
    setCurrentSrc(src);
    setHasTriedProxy(false);
  }, [src]);

  const handleLoadingStatusChange = (status: "idle" | "loading" | "loaded" | "error") => {
    if (status === 'error' && !hasTriedProxy && src && typeof src === 'string') {
      setHasTriedProxy(true);
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(src)}`;
      setCurrentSrc(proxyUrl);
    }
    
    if (props.onLoadingStatusChange) {
      props.onLoadingStatusChange(status);
    }
  };

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={currentSrc}
      onLoadingStatusChange={handleLoadingStatusChange}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
