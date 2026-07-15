// word-extractor tip bildirimi göndermiyor — eski .doc çıkarımı için kullandığımız yüzey.
declare module "word-extractor" {
  interface Document {
    getBody(): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getHeaders(): string;
    getFooters(): string;
    getAnnotations(): string;
    getTextboxes(): string;
  }

  class WordExtractor {
    extract(source: string | Buffer): Promise<Document>;
  }

  export = WordExtractor;
}
