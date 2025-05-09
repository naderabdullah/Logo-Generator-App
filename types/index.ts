// Response types from OpenRouter API
export interface OpenRouterResponse {
    id: string;
    model: string;
    created: number;
    object: string;
    choices: Choice[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }
  
  export interface Choice {
    finish_reason: string;
    index: number;
    message: {
      role: string;
      content: string | null;
    };
  }
  
  // Request types for our API
  export interface GenerateImageRequest {
    prompt: string;
    size?: string;
    quality?: string;
  }
  
  export interface ModifyImageRequest {
    prompt: string;
    image: File;
  }
  
  // Response types for our API
  export interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
  }
  
  // Image generation result
  export interface ImageResult {
    image_url: string;
    description?: string;
  }