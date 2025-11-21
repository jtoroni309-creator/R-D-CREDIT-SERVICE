import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface NarrativeImprovement {
  original: string;
  improved: string;
  disclaimer: string;
}

interface MissingInfoSuggestions {
  questions: string[];
  recommendations: string[];
}

export class LLMService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.warn('OpenAI API key not configured');
      this.openai = null as any;
    } else {
      this.openai = new OpenAI({ apiKey });
    }

    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  /**
   * Improve project narrative for clarity and completeness
   */
  async improveNarrative(originalText: string): Promise<NarrativeImprovement> {
    if (!this.openai) {
      throw new AppError('LLM service not configured', 500);
    }

    const prompt = `You are assisting a CPA with an R&D tax credit study under IRC Section 41.

Your task is to improve the following project narrative for clarity, completeness, and professional presentation.

IMPORTANT RULES:
- Do NOT add facts, data, or details not present in the original text
- Do NOT fabricate technical information
- Only rephrase, reorganize, and clarify existing information
- Ensure the narrative addresses the 4-part test requirements
- Use professional tax documentation language
- Keep technical accuracy paramount

Original narrative:
"""
${originalText}
"""

Improved narrative:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert R&D tax credit consultant helping improve documentation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more factual output
        max_tokens: 1500,
      });

      const improved = response.choices[0]?.message?.content || originalText;

      return {
        original: originalText,
        improved: improved.trim(),
        disclaimer: '⚠️ AI-Generated Content: This text was created with AI assistance. It must be reviewed and approved by a qualified CPA before inclusion in the final R&D study.',
      };
    } catch (error: any) {
      logger.error('LLM narrative improvement failed:', error);
      throw new AppError('Failed to improve narrative', 500);
    }
  }

  /**
   * Expand technical details with guided questions
   */
  async expandTechnicalDetails(technicalDescription: string): Promise<string> {
    if (!this.openai) {
      throw new AppError('LLM service not configured', 500);
    }

    const prompt = `Review this technical description for an R&D tax credit project under IRC Section 41.

Expand and improve the technical details while maintaining factual accuracy. Focus on:
- The technological uncertainty being addressed
- The hard sciences involved (engineering, physics, chemistry, biology, computer science)
- The systematic process of experimentation
- The business component being developed or improved

Original description:
"""
${technicalDescription}
"""

Expanded technical description:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an R&D tax credit technical writer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content?.trim() || technicalDescription;
    } catch (error: any) {
      logger.error('LLM technical expansion failed:', error);
      throw new AppError('Failed to expand technical details', 500);
    }
  }

  /**
   * Identify missing information in project documentation
   */
  async suggestMissingInfo(projectData: any): Promise<MissingInfoSuggestions> {
    if (!this.openai) {
      throw new AppError('LLM service not configured', 500);
    }

    const prompt = `Analyze this R&D tax credit project data and identify missing information needed to satisfy IRS requirements under IRC Section 41.

Project Data:
"""
${JSON.stringify(projectData, null, 2)}
"""

Identify:
1. Missing details for the 4-part test (Permitted Purpose, Elimination of Uncertainty, Process of Experimentation, Technological in Nature)
2. Insufficient technical descriptions
3. Missing business component details
4. Gaps in experimentation documentation

Provide specific questions to ask the client:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an R&D tax credit reviewer ensuring IRS compliance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      const lines = content.split('\n').filter((line) => line.trim());

      return {
        questions: lines.filter((line) => line.match(/^\d+\./)),
        recommendations: [
          'Ensure all 4-part test questions have substantive answers (>100 characters)',
          'Include specific technical details about methods and technologies',
          'Document the iterative process and alternatives evaluated',
        ],
      };
    } catch (error: any) {
      logger.error('LLM missing info analysis failed:', error);
      throw new AppError('Failed to analyze missing information', 500);
    }
  }

  /**
   * Validate 4-part test responses
   */
  async validate4PartTest(responses: any): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check each part has substantive answers
    const parts = [
      'permittedPurpose',
      'eliminationUncertainty',
      'processExperimentation',
      'technologicalNature',
    ];

    for (const part of parts) {
      const partData = responses[part];
      if (!partData || typeof partData !== 'object') {
        issues.push(`${part}: Missing responses`);
        continue;
      }

      const answers = Object.values(partData) as string[];
      const shortAnswers = answers.filter((answer) => answer.length < 100);

      if (shortAnswers.length > 0) {
        issues.push(`${part}: ${shortAnswers.length} answer(s) too brief (< 100 characters)`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate executive summary from project data
   */
  async generateExecutiveSummary(engagementData: any): Promise<string> {
    if (!this.openai) {
      throw new AppError('LLM service not configured', 500);
    }

    const prompt = `Create an executive summary for this R&D tax credit study.

Engagement Data:
"""
${JSON.stringify(engagementData, null, 2)}
"""

Write a professional executive summary (2-3 paragraphs) that:
- Summarizes the R&D activities undertaken
- Highlights key qualifying projects
- States total QREs and calculated credits
- Emphasizes compliance with IRC Section 41

Executive Summary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are writing an executive summary for a tax professional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content?.trim() || 'Summary generation failed.';
    } catch (error: any) {
      logger.error('LLM summary generation failed:', error);
      throw new AppError('Failed to generate executive summary', 500);
    }
  }
}
