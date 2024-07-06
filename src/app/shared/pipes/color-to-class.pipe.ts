import { Pipe, PipeTransform } from '@angular/core';
import { Color, DefaultColor } from "../enums/color";

@Pipe({ name: 'colorToClass', standalone: true })
export class ColorToClassPipe implements PipeTransform {

  transform(color?: Color | null, ...classArgs: string[]): string {
    const colorClass = (color ? color : DefaultColor).toLowerCase()
      .replace(' ', '-')
      .replace('_', '-');

    return classArgs.length ?
      `${colorClass}-${classArgs.join('-')}` : colorClass;
  }
}
