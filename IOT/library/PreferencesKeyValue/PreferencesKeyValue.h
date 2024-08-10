#ifndef PREFERENCES_KEY_VALUE_H
#define PREFERENCES_KEY_VALUE_H

#include <Preferences.h>

class PreferencesKeyValue {
public:
    PreferencesKeyValue();
    ~PreferencesKeyValue();
    bool begin(const char* namespaceName);
    bool put(const String& key, const String& value);
    bool get(const String& key, String& value);
    bool remove(const String& key);

private:
    Preferences _prefs;
    String _namespace;
};

#endif // PREFERENCES_KEY_VALUE_H
