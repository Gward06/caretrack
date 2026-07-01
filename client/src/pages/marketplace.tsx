import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Shield, Search, MapPin, DollarSign, Video } from "lucide-react";

const SPECIALIZATIONS = ["ms", "dementia", "mobility", "elderly", "parkinson", "stroke", "alzheimer", "pediatric"];

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-slate-500">No reviews yet</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
      ))}
      <span className="text-xs text-slate-400 ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

function CaregiverCard({ profile }: { profile: any }) {
  return (
    <Card className="border-slate-700/50 hover:border-slate-500/50 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-semibold text-sm">{profile.displayName || "Caregiver"}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <MapPin size={11} />
              {[profile.city, profile.state].filter(Boolean).join(", ") || "Location not listed"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {profile.backgroundCheckVerified && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                <Shield size={10} className="mr-1" /> Verified
              </Badge>
            )}
            {profile.videoUrl && (
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                <Video size={10} className="mr-1" /> Intro video
              </Badge>
            )}
          </div>
        </div>

        <StarRating rating={profile.averageRating} />
        {profile.reviewCount > 0 && (
          <div className="text-xs text-slate-500 mt-0.5">{profile.reviewCount} review{profile.reviewCount !== 1 ? "s" : ""}</div>
        )}

        {profile.bio && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{profile.bio}</p>
        )}

        {profile.specializations?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {profile.specializations.map((s: string) => (
              <Badge key={s} variant="outline" className="text-xs capitalize border-slate-700 text-slate-400">{s}</Badge>
            ))}
          </div>
        )}

        {profile.certifications?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {profile.certifications.map((c: string) => (
              <Badge key={c} className="text-xs bg-slate-800 text-slate-300 border-slate-700">{c}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-1 text-sm font-medium">
            <DollarSign size={14} className="text-slate-400" />
            {profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Rate not listed"}
          </div>
          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const [city, setCity] = useState("");
  const [activeSpecs, setActiveSpecs] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const { data: profiles = [], isLoading } = useQuery<any[]>({
    queryKey: ["marketplace", city, activeSpecs],
    queryFn: () => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (activeSpecs.length) params.set("specializations", activeSpecs.join(","));
      return fetch(`/api/marketplace/caregivers?${params}`).then(r => r.json());
    },
  });

  const toggleSpec = (s: string) =>
    setActiveSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1">Find a Caregiver</h2>
        <p className="text-xs text-slate-400">Verified, reviewed caregivers available in your area</p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input placeholder="Search by city..."
          className="pl-9 bg-slate-800/50 border-slate-700"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setCity(searchInput)}
        />
      </div>

      {/* Specialization filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SPECIALIZATIONS.map(s => (
          <button key={s} onClick={() => toggleSpec(s)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              activeSpecs.includes(s)
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-lg bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No caregivers found matching your criteria.</p>
          <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search a different city.</p>
        </div>
      )}

      <div className="space-y-3">
        {profiles.map((p: any) => <CaregiverCard key={p.id} profile={p} />)}
      </div>
    </div>
  );
}
