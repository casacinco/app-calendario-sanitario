import Link from "next/link";
import type { Banner } from "@/lib/db";

interface Props {
  banners: Banner[];
}

export function PlacementBanners({ banners }: Props) {
  if (banners.length === 0) return null;

  return (
    <div className="space-y-3">
      {banners.map((banner) => (
        <div key={banner.id} className="rounded-2xl overflow-hidden shadow-sm">
          {banner.image_url ? (
            <div className="relative aspect-[16/9]">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              {(banner.description || banner.button_label) && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-bold text-white leading-snug">{banner.title}</p>
                    {banner.description && (
                      <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{banner.description}</p>
                    )}
                    {banner.button_label && banner.button_link && (
                      <Link
                        href={banner.button_link}
                        className="inline-block mt-2.5 px-4 py-1.5 bg-[#CC0000] text-white text-xs font-bold rounded-lg hover:bg-[#AA0000] transition-colors"
                      >
                        {banner.button_label}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-5 bg-white">
              <p className="text-sm font-bold text-gray-900">{banner.title}</p>
              {banner.description && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{banner.description}</p>
              )}
              {banner.button_label && banner.button_link && (
                <Link
                  href={banner.button_link}
                  className="inline-block mt-3 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-lg hover:bg-[#AA0000] transition-colors"
                >
                  {banner.button_label}
                </Link>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
