import type { ComponentType, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: number | string;
  title?: string;
};

export type IconComponent = ComponentType<IconProps>;
