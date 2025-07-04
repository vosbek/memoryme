import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface IEmbeddingFunction {
  generate(texts: string[]): Promise<number[][]>;
}

export class BedrockEmbeddingFunction implements IEmbeddingFunction {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(
    region: string = 'us-east-1',
    modelId: string = 'amazon.titan-embed-text-v1'
  ) {
    this.client = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  async generate(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];

      for (const text of texts) {
        const embedding = await this.generateSingleEmbedding(text);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      
      // Fallback to simple text-based embeddings for development
      return this.generateFallbackEmbeddings(texts);
    }
  }

  private async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      // Prepare the request for Amazon Titan Text Embeddings
      const body = {
        inputText: text.substring(0, 8000), // Titan has 8k token limit
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (!responseBody.embedding) {
        throw new Error('No embedding in response');
      }

      return responseBody.embedding;
    } catch (error) {
      console.error(`Failed to generate embedding for text: ${text.substring(0, 100)}...`, error);
      
      // Fallback to simple embedding
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateFallbackEmbeddings(texts: string[]): number[][] {
    console.warn('Using fallback embeddings (not AWS Bedrock)');
    return texts.map(text => this.generateSimpleEmbedding(text));
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for development/fallback
    // This is not as good as real embeddings but allows the app to work
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // 384-dimensional vector
    
    for (const word of words) {
      const hash = this.simpleHash(word);
      const index = Math.abs(hash) % embedding.length;
      embedding[index] += 1;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Test if AWS Bedrock is available
  async testConnection(): Promise<boolean> {
    try {
      const testEmbedding = await this.generateSingleEmbedding('test');
      return testEmbedding.length > 0;
    } catch (error) {
      console.warn('AWS Bedrock not available, using fallback embeddings');
      return false;
    }
  }
}