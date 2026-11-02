import prisma from "@/lib/prisma";

export class FiscalLockService {
  /**
   * Asserts that the period corresponding to the provided date is open for postings and edits.
   * Throws an explicit error if the fiscal year has been officially closed and locked by the Accountant.
   */
  static async assertPeriodNotLocked(date: Date | string | null | undefined): Promise<void> {
    if (!date) return;
    const d = new Date(date);
    if (isNaN(d.getTime())) return;

    const year = d.getFullYear();

    const closing = await prisma.fiscalYearClosing.findUnique({
      where: { year },
    });

    if (closing && closing.isClosed) {
      const formattedDate = d.toISOString().slice(0, 10);
      throw new Error(
        `Fiscal Period Locked: Transaction date (${formattedDate}) belongs to Fiscal Year ${year}, which was closed and locked on ${
          closing.closedAt ? new Date(closing.closedAt).toISOString().slice(0, 10) : "an earlier date"
        }. Postings, edits, and reversals in a closed fiscal period are strictly prohibited.`
      );
    }
  }

  /**
   * Checks whether a given date belongs to a locked fiscal year without throwing an exception.
   */
  static async isPeriodLocked(date: Date | string | null | undefined): Promise<boolean> {
    if (!date) return false;
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;

    const year = d.getFullYear();
    const closing = await prisma.fiscalYearClosing.findUnique({
      where: { year },
    });

    return !!closing?.isClosed;
  }

  /**
   * Returns a list of all closed fiscal years.
   */
  static async getClosedYears(): Promise<number[]> {
    const closings = await prisma.fiscalYearClosing.findMany({
      where: { isClosed: true },
      select: { year: true },
    });
    return closings.map((c) => c.year);
  }
}
