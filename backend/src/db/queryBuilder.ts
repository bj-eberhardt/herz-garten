export class SqlWhereBuilder {
  readonly params: unknown[] = [];
  private readonly conditions: string[] = [];

  add(condition: string, ...values: unknown[]) {
    const placeholders = values.map((value) => {
      this.params.push(value);
      return `$${this.params.length}`;
    });
    this.conditions.push(
      placeholders.reduce((sql, placeholder, index) => sql.replaceAll(`$param${index + 1}`, placeholder), condition),
    );
  }

  addRaw(condition: string) {
    this.conditions.push(condition);
  }

  clause(prefix = 'where') {
    return this.conditions.length ? `${prefix} ${this.conditions.join(' and ')}` : '';
  }
}
