import Image from "next/image";

type LogoProps = {
  variant?: "full" | "icon";
  className?: string;
  priority?: boolean;
};

const SIZES = {
  full: { width: 480, height: 160 },
  icon: { width: 40, height: 40 },
};

export function Logo({ variant = "full", className, priority }: LogoProps) {
  const src = variant === "full" ? "/brand/logo-full.png" : "/brand/icon-192.png";
  const { width, height } = SIZES[variant];

  return (
    <Image
      src={src}
      alt="LTM Automação"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
