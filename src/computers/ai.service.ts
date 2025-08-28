/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = 'AIzaSyAmGU484Hk6D05fRPBrk6e6I3UmDiV7Lfk';
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not found, AI features will be disabled',
      );
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.logger.log('Google Gemini AI initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Gemini AI', error);
    }
  }

  async classifyApplicationTag(
    appName: string,
  ): Promise<'game' | 'social' | 'office' | 'windows' | 'system' | null> {
    if (!this.model) {
      this.logger.warn('AI model not available, skipping tag classification');
      return null;
    }

    try {
      const prompt = `Classify this application name into exactly one of these categories: game, social, office, windows, system. 
      
    Rules:
    - game: video games, entertainment software
    - social: social media, communication apps, messaging
    - office: productivity tools, business software, document editors
    - windows: Windows system processes, system utilities, core OS components
    - system: background services, hardware drivers, low-level system daemons, security/antivirus tools
    
    Application name: "${appName}"
    
    Respond with only the category name (game, social, office, windows, or system):`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();

      if (
        ['game', 'social', 'office', 'windows', 'system'].includes(response)
      ) {
        return response as 'game' | 'social' | 'office' | 'windows' | 'system';
      }

      this.logger.warn(
        `Unexpected AI response for tag classification: ${response}`,
      );
      return null;
    } catch (error) {
      this.logger.error('Failed to classify application tag', error);
      return null;
    }
  }
  async generateApplicationDescription(
    appName: string,
  ): Promise<string | null> {
    if (!this.model) {
      this.logger.warn(
        'AI model not available, skipping description generation',
      );
      return null;
    }

    try {
      const prompt = `Generate a brief, professional description for this application in 1-2 sentences. 
      
      Application name: "${appName}"
      
      Keep it concise and informative. Focus on what the application does:`;

      const result = await this.model.generateContent(prompt);
      const description = result.response.text().trim();

      if (description && description.length > 0) {
        return description;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to generate application description', error);
      return null;
    }
  }

  async enrichApplication(
    appName: string,
  ): Promise<{ tag: string | null; description: string | null }> {
    try {
      const [tag, description] = await Promise.all([
        this.classifyApplicationTag(appName),
        this.generateApplicationDescription(appName),
      ]);

      return { tag, description };
    } catch (error) {
      this.logger.error('Failed to enrich application with AI', error);
      return { tag: null, description: null };
    }
  }
}
