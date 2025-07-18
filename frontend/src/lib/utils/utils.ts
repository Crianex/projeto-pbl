export function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export class Utils {
    static formatDate(date: Date | null | undefined) {
        if (!date) return "";
        return date.toLocaleDateString("pt-BR");
    }
}
