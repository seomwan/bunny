import { formatString, Strings } from "@core/i18n";
import { requireAssetIndex } from "@lib/api/assets";
import { purgeStorage } from "@lib/api/storage";
import { BunnyPlugin, fetchPlugin, getSettings, removePlugin, startPlugin, stopPlugin } from "@lib/managers/plugins";
import { showConfirmationAlert } from "@lib/ui/alerts";
import { hideSheet } from "@lib/ui/sheets";
import { showToast } from "@lib/ui/toasts";
import { ButtonColors } from "@lib/utils/types";
import { clipboard } from "@metro/common";
import { ActionSheet, IconButton, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { ScrollView, View } from "react-native";

interface InfoProps {
    plugin: BunnyPlugin;
    navigation: any;
}

export default function PluginInfoActionSheet({ plugin, navigation }: InfoProps) {
    const settings = getSettings(plugin.id);

    return <ActionSheet scrollable>
        <ScrollView style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 24 }}>
                <Text variant="heading-xl/semibold">
                    {plugin.manifest.name}
                </Text>
                <View style={{ marginLeft: "auto" }}>
                    {settings && <IconButton
                        size="md"
                        variant="secondary"
                        icon={requireAssetIndex("SettingsIcon")}
                        onPress={() => {
                            hideSheet("PluginInfoActionSheet");
                            navigation.push("VendettaCustomPage", {
                                title: plugin.manifest.name,
                                render: settings,
                            });
                        }}
                    />}
                </View>
            </View>
            <TableRowGroup>
                <TableRow
                    label={Strings.REFETCH}
                    icon={<TableRow.Icon source={requireAssetIndex("RetryIcon")} />}
                    onPress={async () => {
                        if (plugin.enabled) stopPlugin(plugin.id, false);

                        try {
                            await fetchPlugin(plugin.id);
                            showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, requireAssetIndex("toast_image_saved"));
                        } catch {
                            showToast(Strings.PLUGIN_REFETCH_FAILED, requireAssetIndex("Small"));
                        }

                        if (plugin.enabled) await startPlugin(plugin.id);
                    }}
                />
                <TableRow
                    label={Strings.COPY_URL}
                    icon={<TableRow.Icon source={requireAssetIndex("copy")} />}
                    onPress={() => {
                        clipboard.setString(plugin.id);
                        showToast.showCopyToClipboard();
                    }}
                />
                <TableRow
                    label={plugin.update ? Strings.DISABLE_UPDATES : Strings.ENABLE_UPDATES}
                    icon={<TableRow.Icon source={requireAssetIndex("ic_download_24px")} />}
                    onPress={() => {
                        plugin.update = !plugin.update;
                        showToast(formatString("TOASTS_PLUGIN_UPDATE", {
                            update: plugin.update,
                            name: plugin.manifest.name
                        }), requireAssetIndex("toast_image_saved"));
                    }}
                />
                <TableRow
                    label={Strings.CLEAR_DATA}
                    icon={<TableRow.Icon source={requireAssetIndex("ic_duplicate")} />}
                    onPress={() => showConfirmationAlert({
                        title: Strings.HOLD_UP,
                        content: formatString("ARE_YOU_SURE_TO_CLEAR_DATA", { name: plugin.manifest.name }),
                        confirmText: Strings.CLEAR,
                        cancelText: Strings.CANCEL,
                        confirmColor: ButtonColors.RED,
                        onConfirm: async () => {
                            if (plugin.enabled) stopPlugin(plugin.id, false);

                            try {
                                await fetchPlugin(plugin.id);
                                showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, requireAssetIndex("toast_image_saved"));
                            } catch {
                                showToast(Strings.PLUGIN_REFETCH_FAILED, requireAssetIndex("Small"));
                            }

                            let message: any[];
                            try {
                                purgeStorage(plugin.id);
                                message = ["CLEAR_DATA_SUCCESSFUL", "trash"];
                            } catch {
                                message = ["CLEAR_DATA_FAILED", "Small"];
                            }

                            showToast(
                                formatString(message[0], { name: plugin.manifest.name }),
                                requireAssetIndex(message[1])
                            );

                            if (plugin.enabled) await startPlugin(plugin.id);
                        }
                    })}
                />
                <TableRow
                    label={Strings.DELETE}
                    icon={<TableRow.Icon source={requireAssetIndex("ic_message_delete")} />}
                    onPress={() => showConfirmationAlert({
                        title: Strings.HOLD_UP,
                        content: formatString("ARE_YOU_SURE_TO_DELETE_PLUGIN", { name: plugin.manifest.name }),
                        confirmText: Strings.DELETE,
                        cancelText: Strings.CANCEL,
                        confirmColor: ButtonColors.RED,
                        onConfirm: () => {
                            try {
                                removePlugin(plugin.id);
                            } catch (e) {
                                showToast(String(e), requireAssetIndex("Small"));
                            }
                        }
                    })}
                />
            </TableRowGroup>
        </ScrollView>
    </ActionSheet>;
}
