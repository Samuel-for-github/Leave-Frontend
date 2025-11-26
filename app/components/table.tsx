// Table.tsx
import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from "react-native";

export type Column<T = Record<string, any>> = {
    /** key to read from row object */
    key: keyof T | string;
    /** header title shown */
    title?: string;
    /** width can be number (px) or string (e.g. '20%') */
    width?: number | string;
    /** optional custom cell renderer */
    render?: (value: any, row: T, rowIndex: number, colIndex: number) => React.ReactNode;
    /** optional header renderer */
    headerRender?: (title?: string, colIndex?: number) => React.ReactNode;
    /** optional style overrides */
    headerStyle?: TextStyle;
    cellStyle?: TextStyle;
    columnContainerStyle?: ViewStyle;
};

export interface TableProps<T = Record<string, any>> {
    columns: Column<T>[];
    data: T[];
    /** unique key extractor for rows */
    keyExtractor?: (item: T, index: number) => string;
    /** row container style */
    rowStyle?: ViewStyle;
    /** header row style */
    headerRowStyle?: ViewStyle;
    /** cell default style */
    cellDefaultStyle?: TextStyle;
    /** header default style */
    headerDefaultStyle?: TextStyle;
    /** fallback empty text when value is null/undefined */
    emptyText?: string;
    /** container style */
    style?: ViewStyle;
}

/**
 * Generic, reusable Table component for React Native
 */
function Table<T extends Record<string, any> = Record<string, any>>({
                                                                        columns,
                                                                        data,
                                                                        keyExtractor,
                                                                        rowStyle,
                                                                        headerRowStyle,
                                                                        cellDefaultStyle,
                                                                        headerDefaultStyle,
                                                                        emptyText = "",
                                                                        style,
                                                                    }: TableProps<T>): React.ReactElement {
    const getRowKey = (row: T, index: number): string => {
        if (keyExtractor) {
            return keyExtractor(row, index);
        }
        return `row_${index}`;
    };

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View>
                    {/* Header */}
                    <View style={[styles.row, styles.headerRow, headerRowStyle]}>
                        {columns.map((col, colIndex) => {
                            const widthStyle= col.width != null ? { width: col.width } : styles.defaultColumnWidth;
                            return (
                                <View
                                    key={`header_${String(col.key)}_${colIndex}`}
                                    style={[styles.cellContainer, widthStyle, col.columnContainerStyle]}
                                >
                                    {col.headerRender ? (
                                        col.headerRender(col.title, colIndex)
                                    ) : (
                                        <Text style={[styles.headerText, headerDefaultStyle, col.headerStyle]}>
                                            {col.title ?? String(col.key)}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Rows */}
                    {data.map((row, rowIndex) => (
                        <View key={getRowKey(row, rowIndex)} style={[styles.row, rowStyle]}>
                            {columns.map((col, colIndex) => {
                                const widthStyle = col.width != null ? { width: col.width } : styles.defaultColumnWidth;
                                const rawValue = row[col.key as keyof T];
                                const display = rawValue == null ? emptyText : rawValue;

                                return (
                                    <View
                                        key={`cell_${String(col.key)}_${colIndex}`}
                                        style={[styles.cellContainer, widthStyle, col.columnContainerStyle]}
                                    >
                                        {col.render ? (
                                            col.render(rawValue, row, rowIndex, colIndex)
                                        ) : (
                                            <Text style={[styles.cellText, cellDefaultStyle, col.cellStyle]}>
                                                {String(display)}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </ScrollView>
    );
}

export default Table;

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#e0e0e0",
    },
    headerRow: {
        backgroundColor: "#222",
    },
    cellContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: "#e6e6e6",
    },
    defaultColumnWidth: {
        width: 120,
    },
    headerText: {
        color: "#fff",
        fontWeight: "700",
        textAlign: "center",
    },
    cellText: {
        color: "#111",
        textAlign: "center",
    },
});