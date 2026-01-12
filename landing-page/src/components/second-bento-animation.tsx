import { Icons } from "@/components/icons";
import { OrbitingCircles } from "@/components/ui/orbiting-circle";

export function SecondBentoAnimation() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20"></div>
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-background to-transparent z-20"></div>

      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-[#8B5CF6] p-2 rounded-full z-30 md:bottom-0 md:top-auto">
        <Icons.logo className="stroke-white size-10" />
      </div>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center translate-y-0 md:translate-y-32">
          <OrbitingCircles
            index={0}
            iconSize={60}
            radius={100}
            reverse
            speed={1}
          >
            <Icons.smartphone />
            <Icons.laptop />
            <Icons.tablet />
          </OrbitingCircles>

          <OrbitingCircles index={1} iconSize={60} speed={0.5}>
            <Icons.desktop />
            <Icons.cloud />
            <Icons.watch />
          </OrbitingCircles>

          <OrbitingCircles
            index={2}
            iconSize={60}
            radius={230}
            reverse
            speed={0.5}
          >
            <Icons.folder />
            <Icons.wifi />
            <Icons.transfer />
          </OrbitingCircles>
        </div>
      </div>
    </div>
  );
}
