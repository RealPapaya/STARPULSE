
export interface Work {
  title: string;
  year: string;
  role?: string;
  stats?: string;
}

export interface FamousWork {
  title: string;
  youtubeUrl: string;
}

export interface FeaturedMedia {
  title: string;
  type: 'album' | 'movie';
  description: string;
  releaseDate: string;
  relatedPeople: string[];
}

export interface RelatedCelebrity {
  name: string;
  relationship: string;
}

export interface CelebrityData {
  name: string;
  originalName?: string;
  stageName?: string;
  popularityRating: number;
  ratingJustification: string;
  totalStats: {
    views?: string;
    sales?: string;
    followers?: string;
    awards?: string;
  };
  basicInfo: {
    age: string;
    nationality: string;
    gender: string;
    spouse: string;
    birthDate: string;
    bloodType?: string;
    height?: string;
    awards: string[];
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  growthBackground: string;
  careerStory: string;
  works: Work[];
  famousWorks: FamousWork[];
  featuredMedia: FeaturedMedia;
  relatedCelebrities: RelatedCelebrity[];
  others: string;
  tags: string[];
}

export type SectionType = 'basic' | 'growth' | 'story' | 'works' | 'famous' | 'others' | 'media' | 'rating' | 'stats' | 'related' | 'awards';
