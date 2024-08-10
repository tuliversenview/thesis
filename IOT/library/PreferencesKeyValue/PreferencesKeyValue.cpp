#include "PreferencesKeyValue.h"

PreferencesKeyValue::PreferencesKeyValue() {}

PreferencesKeyValue::~PreferencesKeyValue() {
    _prefs.end();
}

bool PreferencesKeyValue::begin(const char* namespaceName) {
    _namespace = namespaceName;
    _prefs.begin(_namespace.c_str(), false); // Open in read-write mode
    return true;
}

bool PreferencesKeyValue::put(const String& key, const String& value) {
    _prefs.putString(key.c_str(), value.c_str());
    return true;
}

bool PreferencesKeyValue::get(const String& key, String& value) {
    if (_prefs.isKey(key.c_str())) {
        value = _prefs.getString(key.c_str());
        return true;
    }
    return false;
}

bool PreferencesKeyValue::remove(const String& key) {
    if (_prefs.isKey(key.c_str())) {
        _prefs.remove(key.c_str());
        return true;
    }
    return false;
}
