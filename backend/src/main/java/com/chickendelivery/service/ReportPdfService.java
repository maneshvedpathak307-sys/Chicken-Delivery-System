package com.chickendelivery.service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class ReportPdfService {

    private static final DecimalFormat MONEY_FORMAT =
            new DecimalFormat("#,##0.00");

    public byte[] generateDailyReportPdf(
            Map<String, Object> report) {

        if (report == null || report.isEmpty()) {
            throw new IllegalArgumentException(
                    "Report data is not available."
            );
        }

        try (ByteArrayOutputStream outputStream =
                     new ByteArrayOutputStream()) {

            Document document = new Document(
                    PageSize.A4,
                    42,
                    42,
                    42,
                    42
            );

            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font hospitalFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    20,
                    Font.BOLD
            );

            Font titleFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    15,
                    Font.BOLD
            );

            Font sectionFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    12,
                    Font.BOLD
            );

            Font boldFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    10,
                    Font.BOLD
            );

            Font normalFont = FontFactory.getFont(
                    FontFactory.HELVETICA,
                    10,
                    Font.NORMAL
            );

            Font smallFont = FontFactory.getFont(
                    FontFactory.HELVETICA,
                    9,
                    Font.NORMAL
            );

            Paragraph heading = new Paragraph(
                    "CHICKEN DELIVERY SYSTEM",
                    hospitalFont
            );
            heading.setAlignment(Element.ALIGN_CENTER);
            heading.setSpacingAfter(4);
            document.add(heading);

            Paragraph subtitle = new Paragraph(
                    "Fresh Products - Daily Business Report",
                    smallFont
            );
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);

            document.add(new Paragraph(" "));

            Paragraph title = new Paragraph(
                    "DAILY BUSINESS REPORT",
                    titleFont
            );
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(16);
            document.add(title);

            String reportDate = getReportDate(report);

            PdfPTable dateTable = new PdfPTable(2);
            dateTable.setWidthPercentage(100);
            dateTable.setWidths(new float[] { 1.5f, 2f });

            addInfoRow(
                    dateTable,
                    "Report Date",
                    reportDate,
                    boldFont,
                    normalFont
            );

            document.add(dateTable);
            document.add(new Paragraph(" "));

            Paragraph statisticsTitle = new Paragraph(
                    "BUSINESS STATISTICS",
                    sectionFont
            );
            statisticsTitle.setSpacingBefore(8);
            statisticsTitle.setSpacingAfter(8);
            document.add(statisticsTitle);

            PdfPTable statisticsTable = new PdfPTable(2);
            statisticsTable.setWidthPercentage(100);
            statisticsTable.setWidths(new float[] { 3f, 1.5f });
            statisticsTable.setHeaderRows(1);

            addHeaderCell(
                    statisticsTable,
                    "Description",
                    boldFont,
                    Element.ALIGN_LEFT
            );

            addHeaderCell(
                    statisticsTable,
                    "Value",
                    boldFont,
                    Element.ALIGN_RIGHT
            );

            addReportRow(
                    statisticsTable,
                    "Total orders received",
                    getNumber(report, "todayOrders"),
                    normalFont
            );

            addReportRow(
                    statisticsTable,
                    "Pending orders",
                    getNumber(report, "pendingOrders"),
                    normalFont
            );

            addReportRow(
                    statisticsTable,
                    "Delivered orders (after returns)",
                    getNumber(report, "deliveredOrders"),
                    normalFont
            );

            addReportRow(
                    statisticsTable,
                    "Cancelled orders",
                    getNumber(report, "cancelledOrders"),
                    normalFont
            );

            addReportRow(
                    statisticsTable,
                    "Returned / Refunds",
                    getNumber(report, "returnedOrders"),
                    normalFont
            );

            addReportRow(
                    statisticsTable,
                    "Net delivered revenue (INR)",
                    formatMoney(report.get("todayRevenue")),
                    normalFont
            );

            document.add(statisticsTable);
            document.add(new Paragraph(" "));

            Paragraph summaryTitle = new Paragraph(
                    "REPORT SUMMARY",
                    sectionFont
            );
            summaryTitle.setSpacingBefore(8);
            summaryTitle.setSpacingAfter(8);
            document.add(summaryTitle);

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[] { 1.5f, 2f });

            addInfoRow(
                    summaryTable,
                    "Report Date",
                    reportDate,
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Today's Orders",
                    getNumber(report, "todayOrders"),
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Pending Orders",
                    getNumber(report, "pendingOrders"),
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Delivered Orders (After Returns)",
                    getNumber(report, "deliveredOrders"),
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Cancelled Orders",
                    getNumber(report, "cancelledOrders"),
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Returned / Refunds",
                    getNumber(report, "returnedOrders"),
                    boldFont,
                    normalFont
            );

            addInfoRow(
                    summaryTable,
                    "Net Delivered Revenue (INR)",
                    formatMoney(report.get("todayRevenue")),
                    boldFont,
                    normalFont
            );

            document.add(summaryTable);

            Paragraph information = new Paragraph(
                    "This report summarizes the Chicken Delivery "
                    + "System's business activity for the selected "
                    + "date. Delivered order counts exclude orders that "
                    + "have reached the return stage. Net revenue is "
                    + "delivered revenue minus completed refunds.",
                    smallFont
            );
            information.setSpacingBefore(24);
            information.setSpacingAfter(20);
            document.add(information);

            Paragraph generatedAt = new Paragraph(
                    "Generated on: "
                    + LocalDateTime.now().format(
                            DateTimeFormatter.ofPattern(
                                    "dd-MM-yyyy HH:mm:ss"
                            )
                    ),
                    smallFont
            );
            generatedAt.setAlignment(Element.ALIGN_CENTER);
            generatedAt.setSpacingAfter(8);
            document.add(generatedAt);

            Paragraph footer = new Paragraph(
                    "Generated by Chicken Delivery System",
                    smallFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception exception) {
            throw new RuntimeException(
                    "Unable to generate daily report PDF.",
                    exception
            );
        }
    }

    private String getReportDate(Map<String, Object> report) {
        Object value = report.get("date");

        if (value == null) {
            return LocalDate.now().toString();
        }

        return value.toString();
    }

    private String getNumber(
            Map<String, Object> report,
            String key) {

        Object value = report.get(key);
        return value == null ? "0" : value.toString();
    }

    private String formatMoney(Object value) {
        if (value == null) {
            return "INR 0.00";
        }

        try {
            BigDecimal amount = new BigDecimal(value.toString());
            return "INR " + MONEY_FORMAT.format(amount);
        } catch (NumberFormatException exception) {
            return "INR 0.00";
        }
    }

    private void addHeaderCell(
            PdfPTable table,
            String text,
            Font font,
            int alignment) {

        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addInfoRow(
            PdfPTable table,
            String label,
            String value,
            Font labelFont,
            Font valueFont) {

        PdfPCell labelCell = new PdfPCell(
                new Phrase(label, labelFont)
        );
        labelCell.setPadding(7);
        labelCell.setBorder(PdfPCell.NO_BORDER);

        PdfPCell valueCell = new PdfPCell(
                new Phrase(value == null ? "-" : value, valueFont)
        );
        valueCell.setPadding(7);
        valueCell.setBorder(PdfPCell.NO_BORDER);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addReportRow(
            PdfPTable table,
            String description,
            String value,
            Font font) {

        PdfPCell descriptionCell = new PdfPCell(
                new Phrase(description, font)
        );
        descriptionCell.setPadding(8);

        PdfPCell valueCell = new PdfPCell(
                new Phrase(value == null ? "-" : value, font)
        );
        valueCell.setPadding(8);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(descriptionCell);
        table.addCell(valueCell);
    }
}