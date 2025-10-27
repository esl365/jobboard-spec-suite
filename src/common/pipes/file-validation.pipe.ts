import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly maxSizeInBytes: number = 5 * 1024 * 1024) {}

  transform(value: any) {
    if (!value) {
      throw new BadRequestException('No file provided');
    }

    if (value.size > this.maxSizeInBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxSizeInBytes / (1024 * 1024)}MB`,
      );
    }

    return value;
  }
}

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  constructor(private readonly allowedTypes: string[] = ['application/pdf']) {}

  transform(value: any) {
    if (!value) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedTypes.includes(value.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`,
      );
    }

    return value;
  }
}
