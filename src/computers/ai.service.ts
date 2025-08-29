/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl = process.env.XAI_API_BASE_URL || 'https://api.x.ai';
  private readonly apiKey = process.env.XAI_API_KEY;
  private readonly model = process.env.XAI_MODEL || 'grok';

  constructor(private readonly httpService: HttpService) {
    this.logger.log(`Grok AI Service initialized with model: ${this.model}`);
    this.logger.log(`xAI API base URL: ${this.baseUrl}`);
    if (!this.apiKey) {
      this.logger.error(
        'xAI API key is missing. Please set XAI_API_KEY in environment variables.',
      );
    }
  }

  private async callGrok(prompt: string): Promise<string> {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/chat/completions`,
          {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No valid response from Grok API');
      }
      return content.trim();
    } catch (error) {
      this.logger.error('Failed to call Grok API:', error.message);
      throw new HttpException(
        'Grok API request failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async classifyApplicationTag(
    appName: string,
  ): Promise<'game' | 'social' | 'office' | 'windows' | 'system' | null> {
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

      const response = await this.callGrok(prompt);
      const category = response.toLowerCase().trim();

      if (
        ['game', 'social', 'office', 'windows', 'system'].includes(category)
      ) {
        return category as 'game' | 'social' | 'office' | 'windows' | 'system';
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
    try {
      const prompt = `Write a short, professional description for this application in Uzbek language (1-2 sentences).

Application name: "${appName}"

Focus on what the application does and its main purpose. Keep it clear and informative.

Example format: "Bu dastur [asosiy funksiya] uchun mo'ljallangan. [Qo'shimcha ma'lumot]."

Write only in Uzbek:`;

      const description = await this.callGrok(prompt);

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

  async healthCheck(): Promise<boolean> {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/v1/models`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error('Grok API health check failed:', error);
      return false;
    }
  }
}
